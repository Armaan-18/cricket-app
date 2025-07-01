import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from './schemas/match.schema';
import { MatchController } from './matches.controller';
import { MatchService } from './matches.service';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { Commentary, CommentarySchema } from './schemas/commentary.schema';
import { CommentaryGateway } from './commentary.gateway';
import { RedisService } from '../../redis.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: Commentary.name, schema: CommentarySchema },
    ])
  ],
  controllers: [MatchController],
  providers: [MatchService, CommentaryGateway, RedisService],
})
export class MatchesModule {}
