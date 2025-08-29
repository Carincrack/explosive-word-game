import { Injectable } from '@nestjs/common';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';

@Injectable()
export class RoundsService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(createRoundDto: CreateRoundDto) {
    return 'This action adds a new round';
  }

  findAll() {
    return `This action returns all rounds`;
  }

  findOne(id: number) {
    return `This action returns a #${id} round`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateRoundDto: UpdateRoundDto) {
    return `This action updates a #${id} round`;
  }

  remove(id: number) {
    return `This action removes a #${id} round`;
  }
}
