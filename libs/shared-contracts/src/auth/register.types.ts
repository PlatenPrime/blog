export type RegisterUserResponse = {
  readonly id: string;
  readonly email: string;
  readonly emailVerificationToken: string;
  readonly emailVerifiedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};
