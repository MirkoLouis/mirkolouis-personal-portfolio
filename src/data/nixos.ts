// NixOS section content (highlights verified against github.com/MirkoLouis/nixos-config)
import type { CuratedProject } from "../lib/types";

// Shaped like a curated project so the shared merge/link helpers apply to it
export const nixosConfig: CuratedProject = {
    slug: "nixos-config",
    title: "My NixOS configuration",
    summary: "My daily driver since August 2026. The entire machine, from the Secure Boot chain to shell functions, is declared in a flake that I maintain and version on GitHub.",
    stack: ["Nix", "NixOS", "Flakes", "home-manager"],
    screenshots: [],
    visibility: "public",
    repo: "MirkoLouis/nixos-config",
};

// What the config does, one line each
export const nixosHighlights: string[] = [
    "Flake on nixos-unstable with home-manager as a NixOS module, so system and user environment rebuild together",
    "Secure Boot through lanzaboote, replacing systemd-boot",
    "CachyOS kernel and NVIDIA driver from Chaotic-Nyx, with Intel + NVIDIA Prime offload",
    "Split into modules by concern: kernel & desktop, packages, virtualisation (Podman, libvirt), Samba shares, system",
    "Weekly garbage collection of generations older than 7 days, plus automatic /nix/store deduplication",
    "Fish functions that rebuild, then commit and push the config in one command",
];

// The full flake.nix shown with Nix syntax highlighting (copied from /etc/nixos; update by hand if it changes)
export const nixosExcerpt = {
    file: "flake.nix",
    code: `{
  description = "Declarative NixOS Flake Configuration for MirkoInNIXOS";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    chaotic.url = "github:chaotic-cx/nyx/nyxpkgs-unstable";

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    lanzaboote = {
      url = "github:nix-community/lanzaboote";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, chaotic, home-manager, ... }@inputs: {
    nixosConfigurations = {
      MirkoInNIXOS = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        specialArgs = { inherit inputs; };
        modules = [
          inputs.lanzaboote.nixosModules.lanzaboote
          ./configuration.nix
          chaotic.nixosModules.default

          home-manager.nixosModules.home-manager
          {
            home-manager.useGlobalPkgs = true;
            home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = { inherit inputs; };
            home-manager.backupFileExtension = "bak";

            home-manager.users.mirkolouis = {
              imports = [
                ./home.nix
              ];
            };
          }
        ];
      };
    };
  };
}`,
};
