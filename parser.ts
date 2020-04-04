const input = {
  type: 'object',
  value: {
    name: {
      type: 'string',
      value: 'Tray.io',
    },
    employees: {
      type: 'number',
      value: 201,
    },
    addresses: {
      type: 'array',
      value: [
        {
          type: 'object',
          value: {
            city: {
              type: 'string',
              value: 'London',
            },
            country: {
              type: 'string',
              value: 'UK',
            },
          },
        },
        {
          type: 'object',
          value: {
            city: {
              type: 'string',
              value: 'San Francisco',
            },
            country: {
              type: 'string',
              value: 'USA',
            },
          },
        },
      ],
    },
  },
};

const output = {
  name: 'Tray.io',
  employees: 201,
  addresses: [
    {
      city: 'London',
      country: 'UK',
    },
    {
      city: 'San Francisco',
      country: 'USA',
    },
  ],
};

interface TypeValue {
  type: 'object' | 'number' | 'string' | 'array';
  value: any;
}

function parseNode(input) {
  switch (input.type) {
    case 'object':
      return Object.keys(input.value).reduce(
        (object, property) => ({
          ...object,
          [property]: parseNode(input.value[property]),
        }),
        {},
      );

    case 'array':
      return input.value.map(node => parseNode(node));

    default:
      return input.value;
  }
}
