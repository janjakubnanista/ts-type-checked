import {
  Primitive,
  TypeOf,
  assert,
  assertArbitrary,
  notNullOrUndefined,
  notOfType,
  nullable,
  numeric,
  oneOf,
  primitive,
  symbol,
} from '../../../utils/utils.v2';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('when strict is true', () => {
  describe('primitives', () => {
    const nonNullableNotOfType = (type: TypeOf): fc.Arbitrary<Primitive> =>
      primitive().filter(notOfType(type)).filter(notNullOrUndefined);

    test('number should not be assignable to different primitive types', () => {
      assert(numeric(), nonNullableNotOfType('number'), [typeCheckFor<number>(), (value) => isA<number>(value)]);
    });

    test('string should not be assignable to different primitive types', () => {
      assert(fc.string(), nonNullableNotOfType('string'), [typeCheckFor<string>(), (value) => isA<string>(value)]);
    });

    test('boolean should not be assignable to different primitive types', () => {
      assert(fc.boolean(), nonNullableNotOfType('boolean'), [typeCheckFor<boolean>(), (value) => isA<boolean>(value)]);
    });

    test('symbol should not be assignable to different primitive types', () => {
      assert(symbol(), nonNullableNotOfType('symbol'), [typeCheckFor<symbol>(), (value) => isA<symbol>(value)]);
    });

    test('null and undefined should not be assignable to all primitives', () => {
      assertArbitrary(nullable(), [typeCheckFor<number>(), (value) => isA<number>(value)], false);
      assertArbitrary(nullable(), [typeCheckFor<string>(), (value) => isA<string>(value)], false);
      assertArbitrary(nullable(), [typeCheckFor<boolean>(), (value) => isA<boolean>(value)], false);
      assertArbitrary(nullable(), [typeCheckFor<symbol>(), (value) => isA<symbol>(value)], false);
    });
  });

  type AWSSNSRecordItem = {
    EventSource: string;
    EventVersion: string;
    EventSubscriptionArn: string;
    Sns: {
      Type?: string;
      MessageId?: string;
      TopicArn?: string;
      Subject?: string;
      Message: string;
      Timestamp?: string;
      SignatureVersion?: string;
      Signature?: string;
      MessageAttributes?: any;
    };
  };

  type AWSSNSEvent = {
    Records: Array<AWSSNSRecordItem>;
  };

  const recordItemArbitrary = (): fc.Arbitrary<AWSSNSRecordItem> =>
    fc.record<AWSSNSRecordItem>({
      EventSource: fc.string(),
      EventVersion: fc.string(),
      EventSubscriptionArn: fc.string(),
      Sns: fc.record({
        Type: fc.string(),
        MessageId: fc.string(),
        TopicArn: fc.string(),
        Subject: fc.string(),
        Message: fc.string(),
        Timestamp: fc.string(),
        SignatureVersion: fc.string(),
        Signature: fc.string(),
        MessageAttributes: fc.anything(),
      }),
    });

  const eventArbitrary = (): fc.Arbitrary<AWSSNSEvent> =>
    fc.record<AWSSNSEvent>({
      Records: fc.array(recordItemArbitrary()),
    });

  it('null/undefined should not be valid values for any type', () => {
    const isEvent = typeCheckFor<AWSSNSEvent>();

    const validArbitrary: fc.Arbitrary<AWSSNSEvent> = oneOf(eventArbitrary());
    const invalidArbitrary = oneOf<any>(
      eventArbitrary().map((event) => ({
        ...event,
        Records: {},
      })),
      fc.constantFrom({ Records: null }, { Records: undefined }, null, undefined),
      // Without strict null checks TypeScript is kinda useless - if in this case "Records"
      // is null or undefined the check should return true. But that is the case
      // for virtually any type - numbers, strings, booleans etc all have undefined "Records" property!
      oneOf<any>(fc.string(), numeric(), fc.boolean(), fc.bigInt(), fc.func(fc.anything())) as fc.Arbitrary<any>,
      eventArbitrary()
        .map((event) => ({
          ...event,
          Records: event.Records.map((record) => ({
            ...record,
            Sns: {
              ...record.Sns,
              TopicArn: 7,
            },
          })),
        }))
        .filter((event) => event.Records.length > 0),
    );

    fc.assert(
      fc.property(validArbitrary, (event: AWSSNSEvent): void => {
        expect(isEvent(event)).toBeTruthy();
        expect(isA<AWSSNSEvent>(event)).toBeTruthy();
      }),
    );

    fc.assert(
      fc.property(invalidArbitrary, (notAnEvent: any): void => {
        expect(isEvent(notAnEvent)).toBeFalsy();
        expect(isA<AWSSNSEvent>(notAnEvent)).toBeFalsy();
      }),
    );
  });
});
