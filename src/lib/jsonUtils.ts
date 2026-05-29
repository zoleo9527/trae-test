export const toJsonString = (obj: any): string | null => {
  if (obj === null || obj === undefined) return null
  try {
    return JSON.stringify(obj)
  } catch {
    return null
  }
}

export const fromJsonString = <T = any>(str: string | null | undefined): T | null => {
  if (!str) return null
  try {
    return JSON.parse(str) as T
  } catch {
    return null
  }
}

export const parseEvidenceUrls = (str: string | null | undefined): string[] => {
  if (!str) return []
  return str.split(',').filter(url => url.trim())
}

export const toEvidenceUrlsString = (urls: string[] | undefined): string | null => {
  if (!urls || urls.length === 0) return null
  return urls.join(',')
}
