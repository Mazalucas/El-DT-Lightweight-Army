export function isSetupComplete(settings, googleConnected) {
    if (!googleConnected)
        return false;
    return settings.meetSources.length > 0;
}
