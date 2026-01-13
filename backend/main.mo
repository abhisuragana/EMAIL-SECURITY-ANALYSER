import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  public type AnalysisResult = {
    report : Text;
    error : ?Text;
  };

  public shared ({ caller }) func storeFile(blob : Storage.ExternalBlob) : async () {
    ();
  };

  public query ({ caller }) func getFile(id : Text) : async ?Storage.ExternalBlob {
    null;
  };

  system func heartbeat() : async () {};
};
