import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommentaryDocument = Commentary & Document;

@Schema()
export class Commentary {
  @Prop({ required: true })
  over: number;

  @Prop({ required: true })
  ball: number;

  @Prop({ 
    required: true, 
    enum: ['run', 'wicket', 'wide', 'no-ball', 'dot', 'boundary', 'six', 'bye', 'leg-bye'] 
  })
  eventType: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ required: true })
  commentaryId: number;

  @Prop()
  runs?: number;

}

export const CommentarySchema = SchemaFactory.createForClass(Commentary);