/** Keeps the leading letter and the last four characters, masks the rest. */
export function maskLicence(licence: string): string {
  return licence.slice(0, 1) + licence.slice(1).replace(/[A-Z0-9](?=[A-Z0-9-]{4,}$)/g, "•")
}
