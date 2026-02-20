import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "users",
  },
})
export class UserClass {
  @prop({ required: true, unique: true })
  public email!: string;

  @prop({ required: true })
  public passwordHash!: string;

  @prop({ default: "" })
  public name?: string;

  @prop({ required: true, enum: UserRole, default: UserRole.MANAGER })
  public role!: UserRole;

  @prop({ default: "" })
  public avatar?: string;
}

export const UserModel = getModelForClass(UserClass);
