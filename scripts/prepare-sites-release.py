"""Local release preparation only: no remote writes, versions, deployment or D1 access."""
import argparse,hashlib,json,pathlib,subprocess,tarfile
p=argparse.ArgumentParser();p.add_argument('--github-commit',required=True);p.add_argument('--sites-checkout',required=True);p.add_argument('--expected-sites-head',required=True);p.add_argument('--output',required=True);a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];site=pathlib.Path(a.sites_checkout).resolve();out=pathlib.Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True)
def git(path,*args,input=None):return subprocess.check_output(['git','-C',str(path),*args],input=input,text=True).strip()
commit=git(root,'rev-parse',a.github_commit+'^{commit}');expected=git(site,'rev-parse','HEAD');assert expected==a.expected_sites_head,'Sites head changed; reconcile on GitHub first'
# This is the checked-out tracked tree used by the build. Uncommitted source is refused.
assert git(root,'rev-parse','HEAD')==commit,'Check out the selected GitHub commit before building'
assert not git(root,'diff','--name-only','HEAD'),'Commit all tracked changes before preparing'
manifest=json.loads(git(root,'show',commit+':.openai/hosting.json'));base=json.loads(git(site,'show',expected+':.openai/hosting.json'))
assert manifest['project_id']==base['project_id']=='appgprj_6ab5bd99340881919e4311a732df6eb9';assert manifest.get('d1')==base.get('d1')=='DB'
# Local fetch only; all GitHub source is retained exactly, with the known Sites head as a parent.
subprocess.run(['git','-C',str(site),'fetch','--quiet',str(root),commit],check=True)
tree=git(site,'rev-parse',commit+'^{tree}');message=f'Release HobbyLib GitHub {commit}\n\nGitHub-Commit: {commit}\nSites-Base: {expected}\n'
candidate=git(site,'-c','user.name=HobbyLib release preparation','-c','user.email=release-preparation@invalid.local','commit-tree',tree,'-p',expected,'-p',commit,input=message)
assert git(site,'rev-parse',candidate+'^{tree}')==git(root,'rev-parse',commit+'^{tree}')
subprocess.run(['git','-C',str(site),'merge-base','--is-ancestor',expected,candidate],check=True)
# Build against this exact clean checkout; never include the source tree or database in the archive.
with (out/'build.log').open('w') as log:subprocess.run(['pnpm','build'],cwd=root,stdout=log,stderr=subprocess.STDOUT,check=True)
dist=root/'dist';hosting=json.loads((dist/'.openai/hosting.json').read_text());assert hosting['project_id']==manifest['project_id'];assert (dist/'server/index.js').is_file()
archive=out/'site.tar.gz'
with tarfile.open(archive,'w:gz') as tar:
 tar.add(dist/'.openai',arcname='.openai',recursive=True)
 for child in sorted(dist.iterdir()):
  if child.name!='.openai':tar.add(child,arcname='dist/'+child.name,recursive=True)
with tarfile.open(archive) as tar:
 names=tar.getnames();assert '.openai/hosting.json' in names;assert 'dist/server/index.js' in names
 assert not any(n.startswith(('snapshots/','research/','work/','data/')) or n.endswith(('.sqlite','.sqlite-wal','.key')) for n in names)
receipt=dict(projectId=manifest['project_id'],githubCommit=commit,sitesBaseCommit=expected,preparedSitesSourceCommit=candidate,identicalSourceTree=True,fastForwardFromObservedSitesHead=True,sitesVersion=None,baselineSitesVersion=64,build='passed',archive=str(archive),archiveSha256=hashlib.sha256(archive.read_bytes()).hexdigest(),archiveBytes=archive.stat().st_size,archiveFiles=len(names),pushedToSites=False,savedVersion=False,published=False,productionDatabaseModified=False,accessMode='custom; unchanged',nativePublishOnPushAccepted=False,next='After separate publication authorization: refresh native site/source HEAD; require unchanged base; push this candidate without force; save_site_version with its exact SHA and archive; deploy saved version preserving audience; read terminal deployment status. Record returned version/deployment IDs. Rebuild if any source changes.')
(out/'mapping.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
