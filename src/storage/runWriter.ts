import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PokemonProduct, ScrapeSummary } from "../domain/product.js";
import { toCsv } from "../exporters/csvExporter.js";
import type { TcgplayerSearchResponse } from "../providers/tcgplayer/types.js";
import { ensureDirectory } from "../utils/fs.js";

export interface RunWriterOptions {
  outDir: string;
  runId: string;
  includeRaw: boolean;
}

export interface RunOutputPaths {
  outputDirectory: string;
  csvPath: string;
  jsonPath: string;
  manifestPath: string;
  rawDirectory: string | null;
}

export class RunWriter {
  private readonly normalizedDirectory: string;
  private readonly exportsDirectory: string;
  private readonly manifestsDirectory: string;
  private readonly rawDirectory: string | null;

  constructor(private readonly options: RunWriterOptions) {
    this.normalizedDirectory = join(options.outDir, "normalized", options.runId);
    this.exportsDirectory = join(options.outDir, "exports", options.runId);
    this.manifestsDirectory = join(options.outDir, "manifests", options.runId);
    this.rawDirectory = options.includeRaw ? join(options.outDir, "raw", options.runId) : null;
  }

  async prepare(): Promise<void> {
    await Promise.all([
      ensureDirectory(this.normalizedDirectory),
      ensureDirectory(this.exportsDirectory),
      ensureDirectory(this.manifestsDirectory),
      this.rawDirectory ? ensureDirectory(this.rawDirectory) : Promise.resolve(null)
    ]);
  }

  async writeRawPage(pageNumber: number, response: TcgplayerSearchResponse): Promise<void> {
    if (!this.rawDirectory) {
      return;
    }

    const fileName = `page-${String(pageNumber).padStart(4, "0")}.json`;
    await writeFile(join(this.rawDirectory, fileName), JSON.stringify(response, null, 2), "utf8");
  }

  async writeProducts(products: PokemonProduct[]): Promise<Pick<RunOutputPaths, "csvPath" | "jsonPath">> {
    const jsonPath = join(this.normalizedDirectory, "pokemon-products.json");
    const csvPath = join(this.exportsDirectory, "pokemon-prices.csv");

    await writeFile(jsonPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");
    await writeFile(csvPath, `${toCsv(products)}\n`, "utf8");

    return { csvPath, jsonPath };
  }

  async writeManifest(summary: ScrapeSummary): Promise<string> {
    const manifestPath = join(this.manifestsDirectory, "manifest.json");
    await writeFile(manifestPath, `${JSON.stringify({ ...summary, manifestPath }, null, 2)}\n`, "utf8");
    return manifestPath;
  }

  getPaths(csvPath = "", jsonPath = "", manifestPath = ""): RunOutputPaths {
    return {
      outputDirectory: this.options.outDir,
      csvPath,
      jsonPath,
      manifestPath,
      rawDirectory: this.rawDirectory
    };
  }
}
