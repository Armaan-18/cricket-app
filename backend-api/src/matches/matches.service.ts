import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from './schemas/match.schema';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { Commentary } from './schemas/commentary.schema';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  async getNextMatchId(): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'matchId' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    return counter.value;
  }

  async getNextCommentaryId(): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'commentaryId' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    return counter.value;
  }

  async createMatch(teamA: string, teamB: string, date: Date): Promise<Match> {
    const matchId = await this.getNextMatchId();
    
    const newMatch = new this.matchModel({
      teamA,
      teamB,
      date,
      matchId,
      commentary: []
    });

    return newMatch.save();
  }

  async addCommentary(
    matchId: number, 
    commentaryData: {
      over: number;
      ball: number;
      eventType: string;
      description: string;
      runs?: number;
      player?: string;
    }
  ): Promise<Match> {
    const commentaryId = await this.getNextCommentaryId();
    
    const commentary: Commentary = {
      ...commentaryData,
      commentaryId,
      timestamp: new Date()
    } as Commentary;

    const updatedMatch = await this.matchModel.findOneAndUpdate(
      { matchId },
      { $push: { commentary } },
      { new: true }
    );

    if (!updatedMatch) {
      throw new Error('Match not found');
    }

    return updatedMatch;
  }

  async getMatchById(matchId: number): Promise<Match> {
    const match = await this.matchModel.findOne({ matchId });
    if (!match) {
      throw new Error('Match not found');
    }
    return match;
  }

  async getAllMatches(): Promise<Match[]> {
    return this.matchModel.find().sort({ date: -1 });
  }

  async getOngoingMatches(): Promise<Match[]> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.matchModel.find({
      date: {
        $gte: today.setHours(0, 0, 0, 0),
        $lt: tomorrow.setHours(0, 0, 0, 0)
      }
    }).sort({ date: -1 });
  }
}