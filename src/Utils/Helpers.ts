export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const waitUntil = (condition: () => Promise<boolean>, interval: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const check = async (): Promise<void> => {
      try {
        if (await condition()) {
          resolve();
        } else {
          setTimeout(check, interval);
        }
      } catch (e) {
        reject(e);
      }
    };

    check();
  });
};
