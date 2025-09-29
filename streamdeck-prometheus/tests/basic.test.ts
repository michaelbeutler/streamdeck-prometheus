describe('Basic Test Setup', () => {
  it('should be able to run tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have Jest globals available', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
    expect(typeof jest).toBe('object');
  });
});