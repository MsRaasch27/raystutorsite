import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log('Fetching sessions for user:', userId);

    // Get user data to determine plan and billing info
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const billing = userData?.billing || {};
    const currentPlan = billing.planType || 'trial';

    // Get plan limits
    const planLimits: Record<string, number> = {
      basic: 4,
      advanced: 8,
      premium: 12,
      unlimited: 30,
      training: 100, // Training plan gets 100 sessions
      trial: 999, // Unlimited for trial
    };

    const monthlyLimit = planLimits[currentPlan] || 0;
    const addonSessions = billing.addonSessions || 0;
    const totalAvailable = monthlyLimit + addonSessions;

    // Count past appointments (sessions) from the appointments collection
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const sessionsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('appointments')
      .where('startTimestamp', '>=', currentMonth)
      .where('startTimestamp', '<', nextMonth)
      .get();

    const sessionsThisMonth = sessionsSnapshot.docs.length;
    const sessionsRemaining = Math.max(0, totalAvailable - sessionsThisMonth);

    console.log('Session info:', {
      currentPlan,
      monthlyLimit,
      addonSessions,
      totalAvailable,
      sessionsThisMonth,
      sessionsRemaining
    });

    // Return session info in the format expected by the frontend
    return NextResponse.json({
      sessionsThisMonth,
      sessionsRemaining,
      monthlyLimit,
      addonSessions,
      totalAvailable,
      currentPlan,
      canSchedule: sessionsRemaining > 0,
      billing: {
        active: billing.active || false,
        planType: currentPlan,
        trialEndDate: billing.trialEndDate,
      },
      sessions: sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    
    // Return default session info if there's an error
    return NextResponse.json({
      sessionsThisMonth: 0,
      sessionsRemaining: 100, // Default to Training plan limit
      monthlyLimit: 100,
      addonSessions: 0,
      totalAvailable: 100,
      currentPlan: 'training',
      canSchedule: true,
      sessions: []
    });
  }
}
