import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema()
export class Counter {
  @Prop({ required: true, unique: true })
  name: string; // 'matchId' or 'commentaryId'

  @Prop({ required: true, default: 1000 }) // Start match IDs from 1000 for 4-digit numbers
  value: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);