"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "");
}

const VALID_ROLES = ["owner", "manager", "coach"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

function isValidRole(role: string): role is ValidRole {
  return (VALID_ROLES as readonly string[]).includes(role);
}

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
  createdAt: Date;
}

export async function listUsersAction(): Promise<UserRow[]> {
  await requireOwner();
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, mustChangePassword: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createUserAction(
  _prevState: { error?: string; tempPassword?: string; email?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; tempPassword?: string; email?: string }> {
  await requireOwner();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "coach");

  if (!email || !name) {
    return { error: "Name and email are required." };
  }
  if (!isValidRole(role)) {
    return { error: "Invalid role." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "A user with that email already exists." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.create({
    data: { email, name, role, passwordHash, mustChangePassword: true },
  });

  revalidatePath("/users");
  return { tempPassword, email };
}

export async function updateUserRoleAction(userId: string, role: string) {
  const owner = await requireOwner();

  if (!isValidRole(role)) {
    throw new Error("Invalid role.");
  }

  if (role !== "owner") {
    // Never allow the last owner account to demote itself (or be demoted) into a
    // state where nobody can manage user accounts.
    const ownerCount = await prisma.user.count({ where: { role: "owner" } });
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target?.role === "owner" && ownerCount <= 1) {
      throw new Error("Can't demote the only remaining owner.");
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/users");

  return { selfDemoted: userId === owner.id && role !== "owner" };
}

export async function resetPasswordAction(userId: string): Promise<{ tempPassword: string }> {
  await requireOwner();

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidatePath("/users");
  return { tempPassword };
}

export async function deleteUserAction(userId: string) {
  const owner = await requireOwner();

  if (userId === owner.id) {
    throw new Error("You can't delete your own account.");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (target?.role === "owner") {
    const ownerCount = await prisma.user.count({ where: { role: "owner" } });
    if (ownerCount <= 1) {
      throw new Error("Can't delete the only remaining owner.");
    }
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/users");
}
