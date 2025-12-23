import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/sanitize";
import { validateCSRF, csrfErrorResponse } from "@/lib/csrf";

// GET - Fetch user profile (onboarding data)
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json({
      exists: false,
      onboardingCompleted: false
    });
  }

  // Parse JSON fields safely
  return NextResponse.json({
    exists: true,
    ...profile,
    experienceLevels: safeJsonParse(profile.experienceLevels, null),
    currentChallenges: safeJsonParse(profile.currentChallenges, null),
    interests: safeJsonParse(profile.interests, null),
    sensitivities: safeJsonParse(profile.sensitivities, null),
  });
}

// POST - Create or update user profile
export async function POST(request: NextRequest) {
  // CSRF validation
  const csrf = validateCSRF(request);
  if (!csrf.valid) {
    return csrfErrorResponse(csrf.error);
  }

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  // Prepare data for storage - stringify JSON fields
  const profileData = {
    primaryIntention: data.primaryIntention || null,
    lifeSituation: data.lifeSituation || null,
    experienceLevels: data.experienceLevels ? JSON.stringify(data.experienceLevels) : null,
    hasAwakeningExperience: data.hasAwakeningExperience || false,
    awakeningDescription: data.awakeningDescription || null,
    currentChallenges: data.currentChallenges ? JSON.stringify(data.currentChallenges) : null,
    interests: data.interests ? JSON.stringify(data.interests) : null,
    depthPreference: data.depthPreference || null,
    learningStyle: data.learningStyle || null,
    timeAvailable: data.timeAvailable || null,
    sensitivities: data.sensitivities ? JSON.stringify(data.sensitivities) : null,
    onboardingCompleted: data.onboardingCompleted || false,
  };

  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: profileData,
    create: {
      userId: session.user.id,
      ...profileData,
    },
  });

  return NextResponse.json({
    success: true,
    profile: {
      ...profile,
      experienceLevels: safeJsonParse(profile.experienceLevels, null),
      currentChallenges: safeJsonParse(profile.currentChallenges, null),
      interests: safeJsonParse(profile.interests, null),
      sensitivities: safeJsonParse(profile.sensitivities, null),
    },
  });
}

// PATCH - Partial update of user profile
export async function PATCH(request: NextRequest) {
  // CSRF validation
  const csrf = validateCSRF(request);
  if (!csrf.valid) {
    return csrfErrorResponse(csrf.error);
  }

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  // Only update fields that are provided
  const updateData: Record<string, unknown> = {};

  if (data.primaryIntention !== undefined) updateData.primaryIntention = data.primaryIntention;
  if (data.lifeSituation !== undefined) updateData.lifeSituation = data.lifeSituation;
  if (data.experienceLevels !== undefined) updateData.experienceLevels = JSON.stringify(data.experienceLevels);
  if (data.hasAwakeningExperience !== undefined) updateData.hasAwakeningExperience = data.hasAwakeningExperience;
  if (data.awakeningDescription !== undefined) updateData.awakeningDescription = data.awakeningDescription;
  if (data.currentChallenges !== undefined) updateData.currentChallenges = JSON.stringify(data.currentChallenges);
  if (data.interests !== undefined) updateData.interests = JSON.stringify(data.interests);
  if (data.depthPreference !== undefined) updateData.depthPreference = data.depthPreference;
  if (data.learningStyle !== undefined) updateData.learningStyle = data.learningStyle;
  if (data.timeAvailable !== undefined) updateData.timeAvailable = data.timeAvailable;
  if (data.sensitivities !== undefined) updateData.sensitivities = JSON.stringify(data.sensitivities);
  if (data.onboardingCompleted !== undefined) updateData.onboardingCompleted = data.onboardingCompleted;

  // Ensure profile exists first
  await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });

  const profile = await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: updateData,
  });

  return NextResponse.json({
    success: true,
    profile: {
      ...profile,
      experienceLevels: safeJsonParse(profile.experienceLevels, null),
      currentChallenges: safeJsonParse(profile.currentChallenges, null),
      interests: safeJsonParse(profile.interests, null),
      sensitivities: safeJsonParse(profile.sensitivities, null),
    },
  });
}
