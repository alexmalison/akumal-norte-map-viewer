{
  description = "Akumal Norte lot map static site";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/1bc55b9def8165e82073919945c3239903fe4dc2";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems
        (system: f system nixpkgs.legacyPackages.${system});
    in {
      packages = forAllSystems (system: pkgs: {
        default = pkgs.runCommand "akumal-norte-lots-map" { } ''
          mkdir -p "$out"
          cp ${./site/index.html} "$out/index.html"
        '';
      });

      apps = forAllSystems (system: pkgs: {
        default = {
          type = "app";
          program = "${pkgs.writeShellScript "serve-akumal-map" ''
            cd ${self.packages.${system}.default}
            exec ${pkgs.python3}/bin/python3 -m http.server 8765 --bind 127.0.0.1
          ''}";
        };
      });

      devShells = forAllSystems (system: pkgs: {
        default = pkgs.mkShell {
          packages = [ pkgs.python3 ];
        };
      });
    };
}
