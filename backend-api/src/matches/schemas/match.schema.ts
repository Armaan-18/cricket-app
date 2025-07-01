import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Commentary, CommentarySchema } from './commentary.schema';
export type MatchDocument = Match & Document;

@Schema()
export class Match {
  @Prop({ required: true })
  teamA: string;

  @Prop({ required: true })
  teamB: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ unique: true })
  matchId: number;

  @Prop({ type: [CommentarySchema], default: [] })
  commentary: Commentary[];
}

export const MatchSchema = SchemaFactory.createForClass(Match);
