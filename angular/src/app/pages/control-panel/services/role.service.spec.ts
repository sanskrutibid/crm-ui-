import { TestBed } from '@angular/core/testing';

import { RoleServiceTs } from './role.service.js';

describe('RoleServiceTs', () => {
  let service: RoleServiceTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoleServiceTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
