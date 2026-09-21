export function oddityIconHref(icon: string): string {
  return `#oddityIcon${icon.charAt(0).toUpperCase()}${icon.slice(1)}`
}
