import { expect } from 'chai';
import { isA, typeCheckFor } from 'ts-type-checked';
import fc from 'fast-check';

describe('with strictNullChecks off', () => {
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
    fc.oneof(fc.constantFrom(null, undefined), arbitrary);

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

    const validArbitrary: fc.Arbitrary<AWSSNSEvent> = fc.oneof(
      eventArbitrary(),
      fc.constantFrom<AWSSNSEvent>({ Records: null }, { Records: undefined }, null, undefined),
      // Without strict null checks TypeScript is kinda useless - if in this case "Records"
      // is null or undefined the check should return true. But that is the case
      // for virtually any type - numbers, strings, booleans etc all have undefined "Records" property!
      fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.bigInt(), fc.func(fc.anything())) as fc.Arbitrary<any>,
    );
    const invalidArbitrary = fc.oneof(
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
        expect(isEvent(event)).to.equal(true);
        expect(isA<AWSSNSEvent>(event)).to.equal(true);
      }),
    );

    fc.assert(
      fc.property(invalidArbitrary, (notAnEvent: unknown): void => {
        expect(isEvent(notAnEvent)).to.equal(false);
        expect(isA<AWSSNSEvent>(notAnEvent)).to.equal(false);
      }),
    );
  });
});
