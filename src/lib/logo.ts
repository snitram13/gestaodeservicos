/** URL pública do logótipo no Supabase Storage (bucket público "empresa"). */
export function logoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/empresa/${path}`
}
