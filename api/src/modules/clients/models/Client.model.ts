import {
  getModelForClass,
  index,
  modelOptions,
  prop,
  type Ref,
} from "@typegoose/typegoose";
import { UserClass } from "../../users/models/User.model";

export enum ClientStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  LEAD = "lead",
}

@index({ managerId: 1, createdAt: -1 })
@index({ status: 1, createdAt: -1 })
@index({ managerId: 1, status: 1, createdAt: -1 })
@index({ name: "text", email: "text", company: "text" })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "clients",
  },
})
export class ClientClass {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public email!: string;

  @prop({ default: "" })
  public phone?: string;

  @prop({ default: "" })
  public company?: string;

  @prop({ required: true, enum: ClientStatus, default: ClientStatus.LEAD })
  public status!: ClientStatus;

  @prop({ ref: () => UserClass, required: true })
  public managerId!: Ref<UserClass>;

  @prop({ default: "" })
  public notes?: string;
}

export const ClientModel = getModelForClass(ClientClass);
