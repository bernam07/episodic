export function pluralize(count: number, singular: string, pluralForm: string = `${singular}s`): string {
  return count === 1 ? singular : pluralForm;
}

export function plural(count: number, singular: string, pluralForm: string = `${singular}s`): string {
  return `${count} ${pluralize(count, singular, pluralForm)}`;
}
