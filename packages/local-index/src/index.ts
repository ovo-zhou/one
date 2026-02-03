import AgentConfig from "./ai/prompt";
import Messages from "./ai/message";
import Conversations from "./ai/conversation";
import { JSONFileSyncPreset } from 'lowdb/node'
import { LowDbClient, Db } from './types'

export default class DatabaseClient {
  private static instance: DatabaseClient;
  private client!: LowDbClient;

  private constructor(dbFilePath: string = '') {
    const defaultData: Db = { agent: [], conversation: [], messages: [] }
    this.client = JSONFileSyncPreset<Db>(dbFilePath, defaultData)
  }

  public static getInstance(dbFilePath: string = ''): DatabaseClient {
    console.log('数据库文件路径', dbFilePath)
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient(dbFilePath);
    }
    return DatabaseClient.instance;
  }

  agentConfig() {
    return AgentConfig.getInstance(this.client)
  }
  message() {
    return Messages.getInstance(this.client)
  }
  conversation() {
    return Conversations.getInstance(this.client)
  }
}
