'use client';

import { useState, useRef, useCallback } from 'react';
import { importsApi } from '@/lib/api';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileUp,
  Clock,
  Truck,
  Droplets,
  AlertTriangle,
} from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';

type ImportState = 'idle' | 'uploading' | 'success' | 'error';

export default function ImportUploadPage() {
  const [state, setState] = useState<ImportState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  }, []);

  const validateAndSetFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xlsb', 'xls'].includes(ext || '')) {
      setError('Format non supporté. Utilisez .xlsx, .xlsb ou .xls');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 10 MB)');
      return;
    }
    setError('');
    setFile(f);
    setState('idle');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setState('uploading');
    setError('');

    try {
      const data = await importsApi.upload(file);
      setResult(data);
      setState('success');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'import');
      setState('error');
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setState('idle');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="page-title">Importer un fichier Excel</h1>
        <p className="page-subtitle">Import automatique des consommations fuel depuis un fichier Excel</p>
      </div>

      {/* Info banner */}
      <div className="bg-accent/60 border border-accent rounded-xl p-4">
        <div className="flex gap-3">
          <div className="text-primary-600 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-sm space-y-1">
            <p className="font-semibold text-foreground">Informations sur l'import</p>
            <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Seule la <strong>première feuille</strong> du fichier est lue</li>
              <li>Colonnes détectées automatiquement : engin, compteur, gasoil, poste, date</li>
              <li>Heures de marche calculées : <strong>nouveau compteur – dernier compteur</strong></li>
              <li>Consommation/heure calculée automatiquement</li>
              <li>Engins non reconnus créés automatiquement</li>
              <li>Fichier archivé après import</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      {!result && (
        <div>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                : file
                ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/5'
                : 'border-border hover:border-primary-400 hover:bg-accent/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xlsb,.xls"
              onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
              className="hidden"
            />

            {file ? (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">{file.name}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mx-auto transition-colors"
                >
                  <X className="h-3 w-3" />
                  Supprimer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center">
                  <FileUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">
                    {isDragging ? 'Déposez votre fichier ici' : 'Glissez votre fichier Excel ici'}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    ou <span className="text-primary-600 font-medium">cliquez pour sélectionner</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Formats acceptés : .xlsx, .xlsb, .xls • Taille max : 10 MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl p-3 border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {file && state !== 'uploading' && (
            <button
              onClick={handleUpload}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-primary-500/25"
            >
              <Upload className="h-5 w-5" />
              Lancer l'import
            </button>
          )}

          {state === 'uploading' && (
            <div className="mt-4 flex items-center justify-center gap-3 py-4 text-primary-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              <div>
                <p className="font-semibold">Import en cours...</p>
                <p className="text-sm text-muted-foreground">Lecture et traitement du fichier Excel</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && state === 'success' && (
        <div className="space-y-4 animate-fade-in">
          {/* Success banner */}
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">Import réussi !</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Le fichier a été traité et archivé avec succès.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Lignes traitées', value: result.resume?.totalLignes || 0, icon: FileSpreadsheet, color: 'blue' },
              { label: 'Enregistrements créés', value: result.resume?.creees || 0, icon: CheckCircle2, color: 'green' },
              { label: 'Engins détectés', value: result.import?.nombreEngins || 0, icon: Truck, color: 'primary' },
              { label: 'Erreurs', value: result.resume?.erreurs || 0, icon: AlertCircle, color: 'red' },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Import details */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Détails de l'import</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Fichier :</span>
                <span className="ml-2 font-medium">{result.import?.nomFichier}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Statut :</span>
                <span className={`ml-2 font-medium px-2 py-0.5 rounded-full text-xs ${
                  result.import?.statut === 'SUCCES'
                    ? 'bg-green-50 text-green-700'
                    : result.import?.statut === 'PARTIEL'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {result.import?.statut}
                </span>
              </div>
              {result.import?.periodeDebut && (
                <div>
                  <span className="text-muted-foreground">Période :</span>
                  <span className="ml-2 font-medium">
                    {formatDate(result.import.periodeDebut)} – {formatDate(result.import.periodeFin)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Warnings */}
          {result.resume?.avertissements?.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 p-4">
              <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {result.resume.avertissements.length} ligne(s) ignorée(s)
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 max-h-32 overflow-y-auto">
                {result.resume.avertissements.slice(0, 10).map((w: any, i: number) => (
                  <li key={i}>Ligne {w.row}: {w.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
            >
              Importer un autre fichier
            </button>
            <a
              href="/consommations"
              className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium text-center transition-colors"
            >
              Voir les consommations
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
