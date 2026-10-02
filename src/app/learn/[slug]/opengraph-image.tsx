import { allLessons } from "@/lib/lessons";
import { OG_SIZE, renderOg, SITE_NAME } from "@/lib/og";

export const alt = `A lesson from ${SITE_NAME}, an interactive D3.js course`;
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams() {
  return allLessons.map((l) => ({ slug: l.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderOg(`/learn/${slug}`);
}
