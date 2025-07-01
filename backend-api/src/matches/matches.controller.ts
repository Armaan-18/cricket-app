import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { MatchService } from './matches.service';
import { Match } from './schemas/match.schema';
import { CommentaryGateway } from './commentary.gateway';

@Controller('matches')
export class MatchController {
  constructor(
    private readonly matchService: MatchService,
    private readonly commentaryGateway: CommentaryGateway
  ) {}

  @Post('start')
  async startMatch(
    @Body() createMatchDto: {
      teamA: string;
      teamB: string;
      date: string;
    }
  ): Promise<Match> {
    const match = await this.matchService.createMatch(
      createMatchDto.teamA,
      createMatchDto.teamB,
      new Date(createMatchDto.date)
    );

    this.commentaryGateway.broadcastMatchStarted(match);

    return match;
  }

  @Post(':id/commentary')
  async addCommentary(
    @Param('id', ParseIntPipe) matchId: number,
    @Body() commentaryDto: {
      over: number;
      ball: number;
      eventType: string;
      description: string;
      runs?: number;
      player?: string;
    }
  ): Promise<Match> {
    const updatedMatch = await this.matchService.addCommentary(matchId, commentaryDto);

    const latestCommentary = updatedMatch.commentary[updatedMatch.commentary.length - 1];
    this.commentaryGateway.broadcastCommentary(matchId, latestCommentary);

    return updatedMatch;
  }

  @Get(':id')
  async getMatchDetails(@Param('id', ParseIntPipe) matchId: number): Promise<Match> {
    return this.matchService.getMatchById(matchId);
  }

  @Get()
  async getAllMatches(): Promise<Match[]> {
    return this.matchService.getAllMatches();
  }

  @Get('ongoing/today')
  async getOngoingMatches(): Promise<Match[]> {
    return this.matchService.getOngoingMatches();
  }
}