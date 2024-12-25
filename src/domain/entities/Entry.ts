export class Entry {
  public readonly createdAt: Date;
  public updatedAt: Date | null;

  constructor(
    public readonly acronym: string,
    private _definition: string
  ) {
    if (!acronym.trim()) {
      throw new Error('Acronym cannot be empty');
    }
    if (!_definition.trim()) {
      throw new Error('Definition cannot be empty');
    }
    this.createdAt = new Date();
    this.updatedAt = null;
  }

  get definition(): string {
    return this._definition;
  }

  updateDefinition(newDefinition: string): void {
    if (!newDefinition.trim()) {
      throw new Error('Definition cannot be empty');
    }
    this._definition = newDefinition;
    this.updatedAt = new Date();
  }
}
