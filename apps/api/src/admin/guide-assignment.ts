import { BadRequestException } from '@nestjs/common';
import { GuideAssignmentLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type GuideAssignmentInput = {
  assignmentLevel: GuideAssignmentLevel;
  countryId?: string | null;
  regionId?: string | null;
  baseCityId?: string | null;
  primaryDistrictId?: string | null;
  hoodId?: string | null;
};

export type ResolvedGuideAssignment = {
  assignmentLevel: GuideAssignmentLevel;
  countryId: string | null;
  regionId: string | null;
  baseCityId: string | null;
  primaryDistrictId: string | null;
  hoodId: string | null;
};

export async function resolveAdminGuideAssignment(
  prisma: PrismaService,
  input: GuideAssignmentInput,
): Promise<ResolvedGuideAssignment> {
  const level = input.assignmentLevel;

  if (level === GuideAssignmentLevel.COUNTRY) {
    if (!input.countryId) {
      throw new BadRequestException('countryId is required for COUNTRY level');
    }
    const country = await prisma.country.findUnique({
      where: { id: input.countryId },
    });
    if (!country) throw new BadRequestException('countryId not found');
    return {
      assignmentLevel: level,
      countryId: country.id,
      regionId: null,
      baseCityId: null,
      primaryDistrictId: null,
      hoodId: null,
    };
  }

  if (level === GuideAssignmentLevel.STATE) {
    if (!input.regionId) {
      throw new BadRequestException('regionId is required for STATE level');
    }
    const region = await prisma.region.findUnique({
      where: { id: input.regionId },
    });
    if (!region) throw new BadRequestException('regionId not found');
    return {
      assignmentLevel: level,
      countryId: region.countryId,
      regionId: region.id,
      baseCityId: null,
      primaryDistrictId: null,
      hoodId: null,
    };
  }

  if (level === GuideAssignmentLevel.CITY) {
    if (!input.baseCityId) {
      throw new BadRequestException('baseCityId is required for CITY level');
    }
    const city = await prisma.city.findUnique({
      where: { id: input.baseCityId },
    });
    if (!city) throw new BadRequestException('baseCityId not found');
    return {
      assignmentLevel: level,
      countryId: city.countryId,
      regionId: city.regionId,
      baseCityId: city.id,
      primaryDistrictId: null,
      hoodId: null,
    };
  }

  if (level === GuideAssignmentLevel.DISTRICT) {
    if (!input.primaryDistrictId) {
      throw new BadRequestException(
        'primaryDistrictId is required for DISTRICT level',
      );
    }
    const district = await prisma.district.findUnique({
      where: { id: input.primaryDistrictId },
      include: { city: true },
    });
    if (!district) {
      throw new BadRequestException('primaryDistrictId not found');
    }
    if (input.baseCityId && input.baseCityId !== district.cityId) {
      throw new BadRequestException(
        'primaryDistrictId must belong to baseCityId',
      );
    }
    return {
      assignmentLevel: level,
      countryId: district.city.countryId,
      regionId: district.city.regionId,
      baseCityId: district.cityId,
      primaryDistrictId: district.id,
      hoodId: null,
    };
  }

  // HOOD
  if (!input.hoodId) {
    throw new BadRequestException('hoodId is required for HOOD level');
  }
  const hood = await prisma.hood.findUnique({
    where: { id: input.hoodId },
    include: { district: { include: { city: true } } },
  });
  if (!hood) throw new BadRequestException('hoodId not found');
  if (
    input.primaryDistrictId &&
    input.primaryDistrictId !== hood.districtId
  ) {
    throw new BadRequestException('hoodId must belong to primaryDistrictId');
  }
  if (input.baseCityId && input.baseCityId !== hood.district.cityId) {
    throw new BadRequestException('hood district must belong to baseCityId');
  }
  return {
    assignmentLevel: level,
    countryId: hood.district.city.countryId,
    regionId: hood.district.city.regionId,
    baseCityId: hood.district.cityId,
    primaryDistrictId: hood.districtId,
    hoodId: hood.id,
  };
}

/** One Main Guide (no parent) per assignment zone key. */
export async function assertOneMainGuidePerZone(
  prisma: PrismaService,
  assignment: ResolvedGuideAssignment,
  excludeUserId?: string,
) {
  const where: Record<string, unknown> = {
    parentGuideId: null,
    assignmentLevel: assignment.assignmentLevel,
    status: 'APPROVED',
  };
  if (assignment.assignmentLevel === 'COUNTRY') {
    where.countryId = assignment.countryId;
  } else if (assignment.assignmentLevel === 'STATE') {
    where.regionId = assignment.regionId;
  } else if (assignment.assignmentLevel === 'CITY') {
    where.baseCityId = assignment.baseCityId;
  } else if (assignment.assignmentLevel === 'DISTRICT') {
    where.primaryDistrictId = assignment.primaryDistrictId;
  } else {
    where.hoodId = assignment.hoodId;
  }
  const clash = await prisma.guideProfile.findFirst({
    where: {
      ...where,
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    select: { userId: true },
  });
  if (clash) {
    throw new BadRequestException(
      'Another Main Guide is already assigned to this zone',
    );
  }
}
