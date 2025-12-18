import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAllPosts, getPostsBySeries } from "@/lib/posts";

const seriesNames: Record<string, string> = {
  'physical-foundation': 'Physical Foundation',
  'inner-work': 'Inner Work Foundations',
  'soul-foundations': 'Soul Foundations',
  'relationship-foundations': 'Relationship Foundations',
  'from-seeking-to-being': 'From Seeking to Being',
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all completed articles for this user
  const completedArticles = await prisma.articleProgress.findMany({
    where: {
      userId: session.user.id,
      completed: true,
    },
    select: { slug: true },
  });

  const completedSlugs = new Set(completedArticles.map(a => a.slug));

  // Get all posts
  const allPosts = getAllPosts();
  const totalArticles = allPosts.length;

  // Calculate series progress
  const seriesIds = Object.keys(seriesNames);
  const seriesProgress = seriesIds.map(seriesId => {
    const seriesPosts = getPostsBySeries(seriesId);
    const completed = seriesPosts.filter(p => completedSlugs.has(p.slug)).length;

    return {
      id: seriesId,
      name: seriesNames[seriesId],
      completed,
      total: seriesPosts.length,
    };
  }).filter(s => s.total > 0);

  return NextResponse.json({
    totalArticles,
    completedCount: completedSlugs.size,
    seriesProgress,
  });
}
