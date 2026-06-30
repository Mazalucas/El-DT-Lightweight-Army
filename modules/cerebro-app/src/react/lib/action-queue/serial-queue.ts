/** Cola FIFO serializada — una mutación de store a la vez. */
export class SerialQueue {
  private chain: Promise<void> = Promise.resolve();

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.chain.then(() => task());
    this.chain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
