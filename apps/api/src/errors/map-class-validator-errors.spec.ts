import { mapClassValidatorErrors } from './map-class-validator-errors';

type ValidationErrorInput = {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationErrorInput[];
};

function validationError(input: ValidationErrorInput): ValidationErrorInput {
  return input;
}

describe('mapClassValidatorErrors', () => {
  it('maps flat validation errors with field paths and constraint codes', () => {
    const errors = [
      validationError({
        property: 'count',
        constraints: {
          isInt: 'count must be an integer number',
          min: 'count must not be less than 1',
        },
      }),
    ];

    expect(
      mapClassValidatorErrors(
        errors as Parameters<typeof mapClassValidatorErrors>[0],
      ),
    ).toEqual([
      {
        field: 'count',
        message: 'count must be an integer number',
        code: 'isInt',
      },
      {
        field: 'count',
        message: 'count must not be less than 1',
        code: 'min',
      },
    ]);
  });

  it('maps nested validation errors with dotted field paths', () => {
    const errors = [
      validationError({
        property: 'address',
        children: [
          validationError({
            property: 'zip',
            constraints: {
              isPostalCode: 'zip must be a postal code',
            },
          }),
        ],
      }),
    ];

    expect(
      mapClassValidatorErrors(
        errors as Parameters<typeof mapClassValidatorErrors>[0],
      ),
    ).toEqual([
      {
        field: 'address.zip',
        message: 'zip must be a postal code',
        code: 'isPostalCode',
      },
    ]);
  });

  it('returns an empty array when there are no constraint messages', () => {
    const errors = [
      validationError({
        property: 'count',
        children: [],
      }),
    ];

    expect(
      mapClassValidatorErrors(
        errors as Parameters<typeof mapClassValidatorErrors>[0],
      ),
    ).toEqual([]);
  });
});
