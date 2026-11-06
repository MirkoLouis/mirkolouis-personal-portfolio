{
    description = "Mark Leo Bagood - portfolio site (Astro, static, Vercel)";

    inputs = {
        # Pinned stable channel (web-app-stack rule)
        nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    };

    outputs = { self, nixpkgs }:
        let
            # Only x86_64-linux is supported (dev machine + CI runner)
            system = "x86_64-linux";
            pkgs = nixpkgs.legacyPackages.${system};
        in
        {
            # Dev shell: Node 24 for Astro, Python + fonttools for the font subset script,
            # and the two font packages the subset script reads from the Nix store
            devShells.${system}.default = pkgs.mkShell {
                packages = [
                    pkgs.nodejs_24
                    (pkgs.python3.withPackages (p: [ p.fonttools p.brotli ]))
                    pkgs.inter
                    pkgs.nerd-fonts.inconsolata
                ];

                # Expose the font store paths to scripts/subset-fonts.py
                shellHook = ''
                    export INTER_FONT_DIR="${pkgs.inter}"
                    export INCONSOLATA_NF_DIR="${pkgs.nerd-fonts.inconsolata}"
                '';
            };
        };
}
