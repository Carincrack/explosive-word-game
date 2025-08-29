import { Injectable } from '@nestjs/common';
import { CreateRankingDto } from './dto/create-ranking.dto';
import { UpdateRankingDto } from './dto/update-ranking.dto';

@Injectable()
export class RankingService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(createRankingDto: CreateRankingDto) {
    return 'This action adds a new ranking';
  }

  findAll() {
    return `This action returns all ranking`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ranking`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateRankingDto: UpdateRankingDto) {
    return `This action updates a #${id} ranking`;
  }

  remove(id: number) {
    return `This action removes a #${id} ranking`;
  }
}
