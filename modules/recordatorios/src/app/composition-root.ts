import { JsonBackupStore } from '../adapters/backup/json-backup';
import { FetchCategoryConfig, FetchInboxQueue } from '../adapters/inbox/fetch-inbox-queue';
import {
  DexieCategoryStore,
  DexieReminderRepository,
} from '../adapters/storage/dexie-reminder-repo';
import { CategoryRegistry } from '../core/services/category-registry';
import { InboxProcessor, ReminderService } from '../core/services/reminder-service';
import type { Category } from '../core/models/category';

export interface AppContext {
  reminderService: ReminderService;
  inboxProcessor: InboxProcessor;
  categoryRegistry: CategoryRegistry;
  categoryStore: DexieCategoryStore;
  backupStore: JsonBackupStore;
  categories: Category[];
  defaultCategoryId: string;
  inboxPollIntervalMs: number;
}

export async function createAppContext(): Promise<AppContext> {
  const categoryRegistry = new CategoryRegistry();
  const categoryStore = new DexieCategoryStore();
  const configLoader = new FetchCategoryConfig();

  const [mergedCategories, defaults, customCategories] = await Promise.all([
    configLoader.loadCategories(),
    configLoader.loadDefaults(),
    categoryStore.listCustom(),
  ]);

  const seed = mergedCategories.filter((c) => c.kind === 'builtin');
  const project = mergedCategories.filter((c) => c.kind === 'project');
  categoryRegistry.setSeed(seed.length > 0 ? seed : mergedCategories.slice(0, 2));
  categoryRegistry.setProject(project);
  categoryRegistry.setCustom(customCategories);

  const repo = new DexieReminderRepository();
  const reminderService = new ReminderService(
    repo,
    categoryRegistry,
    defaults.defaultCategoryId,
  );
  const inboxProcessor = new InboxProcessor(new FetchInboxQueue(), reminderService);
  const backupStore = new JsonBackupStore(categoryStore, categoryRegistry);

  return {
    reminderService,
    inboxProcessor,
    categoryRegistry,
    categoryStore,
    backupStore,
    categories: categoryRegistry.merge(),
    defaultCategoryId: defaults.defaultCategoryId,
    inboxPollIntervalMs: defaults.inboxPollIntervalMs,
  };
}
