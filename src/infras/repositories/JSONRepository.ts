import { FAKE_DB_SLEEP_MS } from '@/data-model/__global/constants';
import { sleep } from '@/lib/utils';
import { UUID } from 'crypto';
import fs from 'fs';

const folder = 'data';

export class JSONRepository<T> {
  constructor(private readonly filePath: string) {}

  protected async readFromFile(): Promise<Record<UUID, T>> {
    try {
      if (!fs.existsSync(folder)) fs.mkdirSync(folder);
      if (!fs.existsSync(`${folder}/${this.filePath}`)) return {};
      await sleep(FAKE_DB_SLEEP_MS);
      const data = fs.readFileSync(`${folder}/${this.filePath}`, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading data from file:', error);
      return {};
    }
  }

  protected async writeToFile<T>(data: Record<UUID, T>) {
    try {
      await sleep(FAKE_DB_SLEEP_MS);
      fs.writeFileSync(
        `${folder}/${this.filePath}`,
        JSON.stringify(data, null, 2),
        'utf-8',
      );
    } catch (error) {
      console.error('Error writing data to file:', error);
    }
  }
}
