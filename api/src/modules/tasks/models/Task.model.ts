import {
  getModelForClass,
  index,
  modelOptions,
  prop,
  type Ref,
} from "@typegoose/typegoose";
import { ClientClass } from "../../clients/models/Client.model";
import { UserClass } from "../../users/models/User.model";

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

@index({ assigneeId: 1, createdAt: -1 })
@index({ status: 1, createdAt: -1 })
@index({ assigneeId: 1, status: 1, createdAt: -1 })
@index({ clientId: 1 })
@index({ dueDate: 1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "tasks",
  },
})
export class TaskClass {
  @prop({ required: true })
  public title!: string;

  @prop({ default: "" })
  public description?: string;

  @prop({ ref: () => ClientClass, required: true })
  public clientId!: Ref<ClientClass>;

  @prop({ ref: () => UserClass, required: true })
  public assigneeId!: Ref<UserClass>;

  @prop({ required: true, enum: TaskStatus, default: TaskStatus.PENDING })
  public status!: TaskStatus;

  @prop({ required: true, enum: TaskPriority, default: TaskPriority.MEDIUM })
  public priority!: TaskPriority;

  @prop({ required: true })
  public dueDate!: string;
}

export const TaskModel = getModelForClass(TaskClass);
