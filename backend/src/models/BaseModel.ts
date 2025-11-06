import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../utils/supabase';

/**
 * Base Model class providing common CRUD operations for data access
 * All models should extend this class
 */
export abstract class BaseModel<T> {
  protected client: SupabaseClient;
  protected adminClient: SupabaseClient;
  protected abstract tableName: string;

  constructor() {
    this.client = supabase;
    this.adminClient = supabaseAdmin;
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Record not found
        }
        throw error;
      }

      return data as T;
    } catch (error) {
      throw new Error(`Failed to find ${this.tableName} by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all records with optional filters
   */
  async findAll(filters?: Record<string, any>): Promise<T[]> {
    try {
      let query = this.client.from(this.tableName).select('*');

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as T[];
    } catch (error) {
      throw new Error(`Failed to find all ${this.tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new record
   */
  async create(record: Partial<T>, useAdmin: boolean = false): Promise<T> {
    try {
      console.log(`[BaseModel.create] Table: ${this.tableName}, Record:`, JSON.stringify(record, null, 2));
      const client = useAdmin ? this.adminClient : this.client;
      const { data, error } = await client
        .from(this.tableName)
        .insert(record as any)
        .select()
        .single();

      if (error) {
        console.error(`[BaseModel.create] Supabase error for ${this.tableName}:`, JSON.stringify(error, null, 2));
        throw error;
      }

      console.log(`[BaseModel.create] Successfully created in ${this.tableName}, ID:`, (data as any)?.id);
      return data as T;
    } catch (error) {
      console.error(`[BaseModel.create] Exception for ${this.tableName}:`, error);
      throw new Error(`Failed to create ${this.tableName}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, updates: Partial<T>, useAdmin: boolean = false): Promise<T> {
    try {
      const client = useAdmin ? this.adminClient : this.client;
      const { data, error } = await client
        .from(this.tableName)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as T;
    } catch (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a record by ID (hard delete)
   */
  async delete(id: string, useAdmin: boolean = false): Promise<boolean> {
    try {
      const client = useAdmin ? this.adminClient : this.client;
      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Soft delete a record by setting deleted_at timestamp
   */
  async softDelete(id: string, useAdmin: boolean = false): Promise<boolean> {
    try {
      const client = useAdmin ? this.adminClient : this.client;
      const { error } = await client
        .from(this.tableName)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to soft delete ${this.tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count records with optional filters
   */
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      let query = this.client.from(this.tableName).select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      throw new Error(`Failed to count ${this.tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        throw error;
      }

      return (count || 0) > 0;
    } catch (error) {
      throw new Error(`Failed to check existence in ${this.tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
