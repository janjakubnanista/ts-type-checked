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

describe('without strict mode', () => {
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

    test('null and undefined should be assignable to all primitives', () => {
      assertArbitrary(nullable(), [typeCheckFor<number>(), (value) => isA<number>(value)], true);
      assertArbitrary(nullable(), [typeCheckFor<string>(), (value) => isA<string>(value)], true);
      assertArbitrary(nullable(), [typeCheckFor<boolean>(), (value) => isA<boolean>(value)], true);
      assertArbitrary(nullable(), [typeCheckFor<symbol>(), (value) => isA<symbol>(value)], true);
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

  const optionalOf = <T>(arbitrary: fc.Arbitrary<T>): fc.Arbitrary<T | null | undefined> =>
    oneOf(nullable(), arbitrary);

  const recordItemArbitrary = (): fc.Arbitrary<AWSSNSRecordItem> =>
    fc.record<AWSSNSRecordItem>({
      EventSource: optionalOf(fc.string()),
      EventVersion: optionalOf(fc.string()),
      EventSubscriptionArn: optionalOf(fc.string()),
      Sns: optionalOf(
        fc.record({
          Type: optionalOf(fc.string()),
          MessageId: optionalOf(fc.string()),
          TopicArn: optionalOf(fc.string()),
          Subject: optionalOf(fc.string()),
          Message: optionalOf(fc.string()),
          Timestamp: optionalOf(fc.string()),
          SignatureVersion: optionalOf(fc.string()),
          Signature: optionalOf(fc.string()),
          MessageAttributes: fc.anything(),
        }),
      ),
    });

  const eventArbitrary = (): fc.Arbitrary<AWSSNSEvent> =>
    fc.record<AWSSNSEvent>({
      Records: fc.array(recordItemArbitrary()),
    });

  it('null/undefined should be valid values for any type', () => {
    const isEvent = typeCheckFor<AWSSNSEvent>();

    const validArbitrary: fc.Arbitrary<AWSSNSEvent> = oneOf(
      eventArbitrary(),
      fc.constantFrom<AWSSNSEvent>({ Records: null }, { Records: undefined }, null, undefined),
      // Without strict null checks TypeScript is kinda useless - if in this case "Records"
      // is null or undefined the check should return true. But that is the case
      // for virtually any type - numbers, strings, booleans etc all have undefined "Records" property!
      oneOf<any>(fc.string(), numeric(), fc.boolean(), fc.bigInt(), fc.func(fc.anything())) as fc.Arbitrary<any>,
    );
    const invalidArbitrary = oneOf<any>(
      eventArbitrary().map((event) => ({
        ...event,
        Records: {},
      })),
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
      }) as any,
    );

    fc.assert(
      fc.property(invalidArbitrary, (notAnEvent: any): void => {
        expect(isEvent(notAnEvent)).toBeFalsy();
        expect(isA<AWSSNSEvent>(notAnEvent)).toBeFalsy();
      }) as any,
    );
  });
});
