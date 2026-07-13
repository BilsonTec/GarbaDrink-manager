export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ligne_ventes: {
        Row: {
          id: string
          prix_unitaire_achat: number
          prix_unitaire_vente: number
          produit_id: string | null
          quantite: number
          vente_id: string | null
        }
        Insert: {
          id?: string
          prix_unitaire_achat: number
          prix_unitaire_vente: number
          produit_id?: string | null
          quantite: number
          vente_id?: string | null
        }
        Update: {
          id?: string
          prix_unitaire_achat?: number
          prix_unitaire_vente?: number
          produit_id?: string | null
          quantite?: number
          vente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ligne_ventes_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ligne_ventes_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      produits: {
        Row: {
          cree_le: string | null
          id: string
          image_url: string | null
          nom: string
          prix_achat: number
          prix_vente: number
          seuil_alerte: number
          stock_actuel: number
        }
        Insert: {
          cree_le?: string | null
          id?: string
          image_url?: string | null
          nom: string
          prix_achat: number
          prix_vente: number
          seuil_alerte?: number
          stock_actuel?: number
        }
        Update: {
          cree_le?: string | null
          id?: string
          image_url?: string | null
          nom?: string
          prix_achat?: number
          prix_vente?: number
          seuil_alerte?: number
          stock_actuel?: number
        }
        Relationships: []
      }
      reapprovisionnements: {
        Row: {
          cree_le: string | null
          id: string
          prix_achat_unitaire: number
          produit_id: string | null
          quantite_ajoutee: number
        }
        Insert: {
          cree_le?: string | null
          id?: string
          prix_achat_unitaire: number
          produit_id?: string | null
          quantite_ajoutee: number
        }
        Update: {
          cree_le?: string | null
          id?: string
          prix_achat_unitaire?: number
          produit_id?: string | null
          quantite_ajoutee?: number
        }
        Relationships: [
          {
            foreignKeyName: "reapprovisionnements_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      sorties_exceptionnelles: {
        Row: {
          cree_le: string | null
          id: string
          motif: string
          produit_id: string | null
          quantite: number
        }
        Insert: {
          cree_le?: string | null
          id?: string
          motif: string
          produit_id?: string | null
          quantite: number
        }
        Update: {
          cree_le?: string | null
          id?: string
          motif?: string
          produit_id?: string | null
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "sorties_exceptionnelles_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      ventes: {
        Row: {
          annulee: boolean
          cree_le: string | null
          encaisse_par: string
          id: string
          mode_paiement: string
          montant_total: number
          solde_le: string | null
          statut_recupere: boolean
        }
        Insert: {
          annulee?: boolean
          cree_le?: string | null
          encaisse_par: string
          id?: string
          mode_paiement: string
          montant_total?: number
          solde_le?: string | null
          statut_recupere?: boolean
        }
        Update: {
          annulee?: boolean
          cree_le?: string | null
          encaisse_par?: string
          id?: string
          mode_paiement?: string
          montant_total?: number
          solde_le?: string | null
          statut_recupere?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      vue_analyse_rentabilite_journaliere: {
        Row: {
          benefice_net_reel: number | null
          chiffre_affaires_brut: number | null
          cout_marchandises_total: number | null
          date_operation: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
