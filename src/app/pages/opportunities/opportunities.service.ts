import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OpportunitiesService {

  private apiUrl =
    `${environment.apiUrl}/opportunities`;

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Get list of filtered opportunities
   */
  getOpportunities(query: {
    viewType?: string;
    search?: string;
    assignedTo?: string;
    updatedSince?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    customerType?: string;
    contactType?: string;
    followupDateFrom?: string;
    followupDateTo?: string;
    createDateFrom?: string;
    createDateTo?: string;
    assignedDateFrom?: string;
    assignedDateTo?: string;
    updateDateFrom?: string;
    updateDateTo?: string;
    submittedBy?: string;
    city?: string;
    location?: string;
    purpose?: string;
    source?: string;
    branch?: string;
    status?: string;
    permission?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<{
    opportunities: any[];
    total: number;
  }> {

    let params =
      new HttpParams();

    Object.keys(query).forEach(key => {

      const val =
        (query as any)[key];

      if (
        val !== undefined &&
        val !== null &&
        val !== ''
      ) {
        params =
          params.set(
            key,
            val.toString()
          );
      }

    });

    return this.http.get<{
      opportunities: any[];
      total: number;
    }>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get my opportunities
   */
  getMyOpportunities(query: {
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{
    opportunities: any[];
    totalRecords: number;
  }> {

    let params =
      new HttpParams();

    Object.keys(query).forEach(key => {

      const val =
        (query as any)[key];

      if (
        val !== undefined &&
        val !== null &&
        val !== ''
      ) {
        params =
          params.set(
            key,
            val.toString()
          );
      }

    });

    return this.http.get<{
      opportunities: any[];
      totalRecords: number;
    }>(
      `${this.apiUrl}/my-opportunities`,
      { params }
    );
  }

  /**
   * Get today's follow-up opportunities
   */
  getTodayFollowup(query: {
    assignedTo?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<any> {

    let params =
      new HttpParams();

    Object.keys(query).forEach(key => {

      const val =
        (query as any)[key];

      if (
        val !== undefined &&
        val !== null &&
        val !== ''
      ) {
        params =
          params.set(
            key,
            val.toString()
          );
      }

    });

    return this.http.get<any>(
      `${this.apiUrl}/today-followup`,
      { params }
    );
  }

  /**
   * Get active pipeline open opportunities
   */
  getOpenOpportunities(query: {
    assignedTo?: string;
    branch?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<any> {

    let params =
      new HttpParams();

    Object.keys(query).forEach(key => {

      const val =
        (query as any)[key];

      if (
        val !== undefined &&
        val !== null &&
        val !== ''
      ) {
        params =
          params.set(
            key,
            val.toString()
          );
      }

    });

    return this.http.get<any>(
      `${this.apiUrl}/open`,
      { params }
    );
  }

  /**
   * Retrieve single opportunity details by ID
   */
  getOpportunityById(
    id: string
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Create a new opportunity
   */
  createOpportunity(
    opportunityData: any
  ): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      opportunityData
    );
  }

  /**
   * Update an existing opportunity
   */
  updateOpportunity(
    id: string,
    opportunityData: any
  ): Observable<any> {

    return this.http.patch<any>(
      `${this.apiUrl}/${id}`,
      opportunityData
    );
  }

  /**
   * Delete an opportunity record
   */
  deleteOpportunity(
    id: string
  ): Observable<any> {

    return this.http.delete<any>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Group delete opportunities
   */
  groupDelete(
    data: any
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/actions/group-delete`,
      data
    );
  }

  /**
   * Export opportunities to Google Drive
   */
  exportToGoogleDrive(
    data: any
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/actions/google-drive`,
      data
    );
  }

  /**
   * Import opportunities
   */
  importOpportunities(
    opportunities: any[]
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/actions/import`,
      opportunities
    );
  }

  /**
   * Change opportunity status
   */
  changeStatus(
    id: string,
    data: {
      status: string;
      outcome: string;
    }
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/${id}/actions/change-status`,
      data
    );
  }

  /**
   * Add quick note
   */
  addQuickNote(
    id: string,
    data: {
      commentType: string;
      comment: string;
    }
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/${id}/actions/quick-note`,
      data
    );
  }

  /**
   * Update requirement
   */
  updateRequirement(
    id: string,
    data: {
      requirement: string;
    }
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/${id}/actions/update-requirement`,
      data
    );
  }

  /**
   * Send SMS
   */
  sendSms(
    id: string,
    data: any
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/${id}/actions/send-sms`,
      data
    );
  }

  /**
   * Send email
   */
  sendEmail(
    id: string,
    data: any
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/${id}/actions/send-email`,
      data
    );
  }

  /**
   * Send proposal
   */
  sendProposal(
    id: string,
    data: any
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/${id}/actions/send-proposal`,
      data
    );
  }

  /**
   * =========================================================
   * LOCATION APIs
   * =========================================================
   */

  /**
   * Get all Indian states
   *
   * Uses the existing Localities backend.
   *
   * Backend endpoint:
   * GET /api/v1/localities/states
   *
   * No separate State module is required.
   */
  getStates(): Observable<any> {

    return this.http.get<any>(
      `${environment.apiUrl}/localities/states`
    );
  }

  /**
   * Get cities for selected state
   *
   * Backend endpoint:
   * GET /api/v1/cities?state=Maharashtra
   *
   * Example:
   * getCities('Maharashtra')
   */
  getCities(
    state?: string
  ): Observable<any> {

    let params =
      new HttpParams();

    if (
      state !== undefined &&
      state !== null &&
      state.trim() !== ''
    ) {
      params =
        params.set(
          'state',
          state.trim()
        );
    }

    return this.http.get<any>(
      `${environment.apiUrl}/cities`,
      { params }
    );
  }

  /**
   * Get localities for selected city
   *
   * Backend endpoint:
   * GET /api/v1/localities?city=Pune
   *
   * Example:
   * getLocalities('Pune')
   */
  getLocalities(
    city: string
  ): Observable<any> {

    const params =
      new HttpParams()
        .set(
          'city',
          city.trim()
        );

    return this.http.get<any>(
      `${environment.apiUrl}/localities`,
      { params }
    );
  }
}