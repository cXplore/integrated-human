import { NextResponse } from "next/server";
import { getAllCourses } from "@/lib/courses";

export async function GET() {
  const courses = getAllCourses();

  return NextResponse.json(courses.map((course) => ({
    id: course.slug,
    title: course.metadata.title,
    modules: course.metadata.modules.map((m) => ({
      slug: m.slug,
      title: m.title,
    })),
  })));
}
