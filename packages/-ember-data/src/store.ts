import JSONAPICache from '@ember-data/json-api';
import {
  adapterFor,
  cleanup,
  LegacyNetworkHandler,
  normalize,
  pushPayload,
  serializeRecord,
  serializerFor,
} from '@ember-data/legacy-compat';
import type { FetchManager } from '@ember-data/legacy-compat/-private';
import type Model from '@ember-data/model';
import type { ModelStore } from '@ember-data/model/-private';
import { buildSchema, instantiateRecord, modelFor, teardownRecord } from '@ember-data/model/hooks';
import RequestManager from '@ember-data/request';
import Fetch from '@ember-data/request/fetch';
import BaseStore, { CacheHandler } from '@ember-data/store';
import type { CacheCapabilitiesManager, ModelSchema } from '@ember-data/store/types';
import type { StableRecordIdentifier } from '@warp-drive/core-types';
import type { Cache } from '@warp-drive/core-types/cache';
import type { TypeFromInstance } from '@warp-drive/core-types/record';

function hasRequestManager(store: BaseStore): boolean {
  return 'requestManager' in store;
}

export default class Store extends BaseStore {
  declare _fetchManager: FetchManager;

  constructor(args?: Record<string, unknown>) {
    super(args);

    if (!hasRequestManager(this)) {
      this.requestManager = new RequestManager();
      this.requestManager.use([LegacyNetworkHandler, Fetch]);
    }
    this.requestManager.useCache(CacheHandler);
    this.registerSchema(buildSchema(this));
  }

  override createCache(storeWrapper: CacheCapabilitiesManager): Cache {
    return new JSONAPICache(storeWrapper);
  }

  override instantiateRecord(
    this: ModelStore,
    identifier: StableRecordIdentifier,
    createRecordArgs: Record<string, unknown>
  ): Model {
    return instantiateRecord.call(this, identifier, createRecordArgs);
  }

  override teardownRecord(record: Model): void {
    teardownRecord.call(this, record);
  }

  override modelFor<T>(type: TypeFromInstance<T>): ModelSchema<T>;
  override modelFor(type: string): ModelSchema;
  override modelFor(type: string): ModelSchema {
    return (modelFor.call(this, type) as ModelSchema) || super.modelFor(type);
  }

  adapterFor = adapterFor;
  serializerFor = serializerFor;
  pushPayload = pushPayload;
  normalize = normalize;
  serializeRecord = serializeRecord;

  override destroy() {
    cleanup.call(this);
    super.destroy();
  }
}
