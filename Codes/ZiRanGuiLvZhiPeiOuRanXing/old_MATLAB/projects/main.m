%% about
% chessboard.pos : show the positions of palyer  at chessboard
% chessboard.color : show the color at chessboard


%%
clc;
clear all;
close all;






%% set parameters
Args.game='Balance';
Args.rule='1';
Args.sizeOfChessboard = 4;
Args.numPlayers=4;
Args.visual='yes';
Args.howManyTimesOfExperiment = 1;
Args.pauseTime=0.0001;

Args


%% create data folder
str020=datestr(now,'yyyymmdd');
folderName020=(str020);
str025=num2str(Args.howManyTimesOfExperiment);
folderName025=str025;
folderParentPath01=('./results/Export Data');
folderPath01=([folderParentPath01,'/',folderName020,'/',folderName025]);
sentence015=(['mkdir(''',folderPath01,''');']);
eval(sentence015);
clear folderName020 folderName025 str020 str025 folderParentPath01 ...
    folderPath01 sentence015;

%% set properties
Pros=Args;

% common properties
load('./resources/playerColorNames');

for i =1:Args.numPlayers
    player(i).id=playerColorNames{i,1};
    player(i).colorName=playerColorNames{i,2};
    player(i).colorSign=playerColorNames{i,3};
    player(i).color=playerColorNames{i,4};
    player(i).pos=[];
end


% private properties
chessboard.pos=zeros(Args.sizeOfChessboard,Args.sizeOfChessboard);
chessboard.color=zeros(Args.sizeOfChessboard,Args.sizeOfChessboard,3);
Pros.numOfPoints=Args.sizeOfChessboard^2;


%% playing
sentence050=['[checkerboard,player,score,Pros] = ' Args.game '(checkerboard,player,Pros);'];
eval(sentence050);




%% end
% pause;











