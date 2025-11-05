import Filter from 'bad-words';

const filter = new Filter();

export function filterProfanity(text: string): string {
  const enabled = process.env.PROFANITY_FILTER_ENABLED === 'true';
  if (!enabled) return text;
  return filter.clean(text);
}

export function hasProfanity(text: string): boolean {
  const enabled = process.env.PROFANITY_FILTER_ENABLED === 'true';
  if (!enabled) return false;
  return filter.isProfane(text);
}

