import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allLessons, getLesson, sections } from "@/lib/lessons";
import { lessonComponents } from "@/lessons";
import { LessonFooter } from "@/components/LessonFooter";

export const dynamicParams = false;

export function generateStaticParams() {
  return allLessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = getLesson(slug);
  return found ? { title: found.lesson.title, description: found.lesson.summary } : {};
}

export default async function LessonPage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const found = getLesson(slug);
  const Content = lessonComponents[slug];
  if (!found || !Content) notFound();

  const { lesson, index, prev, next } = found;
  const section = sections.find((s) => s.lessons.some((l) => l.slug === slug))!;

  return (
    <article className="lesson mx-auto max-w-3xl px-5 pb-24 pt-14 sm:px-8">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--muted)]">
        <span>
          Lesson {index + 1} of {allLessons.length}
        </span>
        <span>·</span>
        <span>{section.title}</span>
        <span className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-2 py-0.5 font-mono text-[var(--accent-text)]">
          {lesson.module}
        </span>
      </div>
      <h1>{lesson.title}</h1>
      <p className="!mt-3 text-lg text-[var(--muted)]">{lesson.summary}</p>
      <div className="mt-8">
        <Content />
      </div>
      <LessonFooter slug={slug} prev={prev} next={next} />
    </article>
  );
}
