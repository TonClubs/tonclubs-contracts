import yargsParser from 'yargs-parser';

// eslint-disable-next-line prefer-destructuring
const env = process.env;

export const argv = yargsParser(process.argv.slice(2));

export const MNEMONIC = env.MNEMONIC || '';
