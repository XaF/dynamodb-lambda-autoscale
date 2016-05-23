import ConfigurableProvisioner from './ConfigurableProvisioner';
import RateLimitedDecrement from './RateLimitedDecrement';
import Throughput from './Throughput';
import { invariant } from '../src/Global';

const provisioner = new ConfigurableProvisioner({
  readCapacity: {
    increment: {
      isAdjustmentRequired: (data, calcFunc) => {
        invariant(typeof data !== 'undefined',
          'Parameter \'data\' is not set');
        invariant(typeof calcFunc !== 'undefined',
          'Parameter \'calcFunc\' is not set');

        return Throughput.getReadCapacityUtilisationPercent(data) > 90;
      },
      calculateValue: data => {
        invariant(typeof data !== 'undefined',
          'Parameter \'data\' is not set');

        // adjustmentPercent or adjustmentUnits is used, which ever is bigger
        const adjustmentPercent = 100;
        const adjustmentUnits = 3;
        // min and max hard limits
        const max = 10;
        const min = 1;
        return Throughput.getPercentAdjustedReadCapacityUnits(
          data, adjustmentPercent, adjustmentUnits, max, min);
      },
    },
    decrement: {
      isAdjustmentRequired: (data, calcFunc) => {
        invariant(typeof data !== 'undefined',
          'Parameter \'data\' is not set');
        invariant(typeof calcFunc !== 'undefined',
          'Parameter \'calcFunc\' is not set');

        // minimum possible downward adjustment, there is no point
        // wasting 1 of 4 daily decrements on a small value
        const minAdjustment = 3;
        const minGracePeriodAfterLastIncrementMinutes = 60;
        const minGracePeriodAfterLastDecrementMinutes = 60;
        return Throughput.getReadCapacityUtilisationPercent(data) < 30 &&
          RateLimitedDecrement.isReadDecrementAllowed(
            data, calcFunc, minAdjustment,
            minGracePeriodAfterLastIncrementMinutes,
            minGracePeriodAfterLastDecrementMinutes);
      },
      calculateValue: data => {
        invariant(typeof data !== 'undefined',
          'Parameter \'data\' is not set');

        return Math.max(data.ConsumedThroughput.ReadCapacityUnits, 1);
      },
    }
  },
  writeCapacity: {
    increment: {
      isAdjustmentRequired: (data, calcFunc) => {
        invariant(typeof data !== 'undefined',
          'Parameter \'data\' is not set');
        invariant(typeof calcFunc !== 'undefined',
          'Parameter \'calcFunc\' is not set');

        return Throughput.getWriteCapacityUtilisationPercent(data) > 90;
      },
      calculateValue: data => {
        invariant(typeof data !== 'undefined',
          'Parameter \'data\' is not set');

        // adjustmentPercent or adjustmentUnits is used, which ever is bigger
        const adjustmentPercent = 100;
        const adjustmentUnits = 3;
        // min and max hard limits
        const max = 10;
        const min = 1;
        return Throughput.getPercentAdjustedWriteCapacityUnits(
          data, adjustmentPercent, adjustmentUnits, max, min);
      },
    },
    decrement: {
      isAdjustmentRequired: (data, calcFunc) => {
        invariant(typeof data !== 'undefined',
          'Parameter \'data\' is not set');
        invariant(typeof calcFunc !== 'undefined',
          'Parameter \'calcFunc\' is not set');

        // minimum possible downward adjustment, there is no point
        // wasting 1 of 4 daily decrements on a small value
        const minAdjustment = 3;
        const minGracePeriodAfterLastIncrementMinutes = 60;
        const minGracePeriodAfterLastDecrementMinutes = 60;
        return Throughput.getWriteCapacityUtilisationPercent(data) < 30 &&
          RateLimitedDecrement.isWriteDecrementAllowed(
            data, calcFunc, minAdjustment,
            minGracePeriodAfterLastIncrementMinutes,
            minGracePeriodAfterLastDecrementMinutes);
      },
      calculateValue: data => {
        invariant(typeof data !== 'undefined',
          'Parameter \'data\' is not set');

        return Math.max(data.ConsumedThroughput.WriteCapacityUnits, 1);
      },
    }
  }
});

export default {
  connection: {
    dynamoDB: {
      apiVersion: '2012-08-10',
      region: 'us-east-1',
      dynamoDbCrc32: false,
      httpOptions: {
        timeout: 5000
      }
    },
    cloudWatch: {
      apiVersion: '2010-08-01',
      region: 'us-east-1',
      httpOptions: {
        timeout: 5000
      }
    }
  },
  getTableUpdate: (description, consumedCapacityDescription) => {
    invariant(typeof description !== 'undefined',
      'Parameter \'description\' is not set');
    invariant(typeof consumedCapacityDescription !== 'undefined',
      'Parameter \'consumedCapacityDescription\' is not set');

    return provisioner.getTableUpdate(description, consumedCapacityDescription);
  }
};
